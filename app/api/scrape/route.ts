import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateScrapeProgress } from "../../../pages/api/scrape-progress";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Lead {
  first_name: string;
  last_name: string;
  email: string;
  website_url: string;
  company: string;
  headline: string;
  location: string;
  phone_number: string;
  email_valid?: boolean;
  [key: string]: string | boolean | undefined;
}

// Function to validate Apify API key
async function validateApifyKey(apifyKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://api.apify.com/v2/users/me", {
      headers: {
        "Authorization": `Bearer ${apifyKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      await response.json(); // Just consume the response
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: "Invalid API key" };
    } else if (response.status === 403) {
      return { valid: false, error: "API key doesn't have required permissions" };
    } else {
      return { valid: false, error: "Failed to validate API key" };
    }
  } catch {
    return { valid: false, error: "Network error while validating API key" };
  }
}

export async function POST(req: NextRequest) {
  const { apolloUrl, userId, scrapeId, apifyKey, reoonKey } = await req.json();

  if (!apolloUrl || !userId) {
    return NextResponse.json({ error: "Missing Apollo URL or user ID" }, { status: 400 });
  }

  // Require user-provided keys
  if (!apifyKey) {
    return NextResponse.json({ error: "Please input your Apify API key." }, { status: 400 });
  }
  if (!reoonKey) {
    return NextResponse.json({ error: "Please input your Reoon API key." }, { status: 400 });
  }

  try {
    // Validate Apify API key before starting scraping
    console.log("Validating Apify API key...");
    const validationResult = await validateApifyKey(apifyKey);
    if (!validationResult.valid) {
      return NextResponse.json({ 
        error: `Apify API key validation failed: ${validationResult.error}` 
      }, { status: 400 });
    }
    console.log("Apify API key validated successfully");

    // 1. Call Apify Scraper
    const apifyRes = await fetch(
      "https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/run-sync-get-dataset-items?format=json&clean=true",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apifyKey}`,
        },
        body: JSON.stringify({
          getPersonalEmails: true,
          fileName: "Apollo Prospects",
          getWorkEmails: true,
          totalRecords: 500,
          url: apolloUrl,
          // sessionToken: 'd2ac941f03876c90490a305202db9eb7',
        }),
      }
    );

    if (!apifyRes.ok) {
      const error = await apifyRes.text();
      console.log("Apify Error:", error);
      
      // Provide more specific error messages based on status codes
      if (apifyRes.status === 401) {
        return NextResponse.json({ error: "Invalid Apify API key. Please check your API key and try again." }, { status: 401 });
      } else if (apifyRes.status === 402) {
        return NextResponse.json({ error: "Apify account has insufficient credits. Please add credits to your Apify account." }, { status: 402 });
      } else if (apifyRes.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a moment and try again." }, { status: 429 });
      } else {
        return NextResponse.json({ error: `Apify scraping failed: ${error}` }, { status: 500 });
      }
    }

    const leads: Lead[] = await apifyRes.json();
    // console.log("Raw Leads:", leads);

    // 2. Standardize fields (handle nested fields)
    let processedCount = 0;
    const standardizedLeads: Lead[] = leads.map((lead: Lead) => {
      processedCount++;
      if (scrapeId) updateScrapeProgress(scrapeId, processedCount);
      return {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        website_url:
          typeof lead.organization_website_url === "string" && lead.organization_website_url
            ? lead.organization_website_url
            : (lead.organization && typeof lead.organization === "object" && typeof (lead.organization as { website_url?: string }).website_url === "string"
                ? (lead.organization as { website_url?: string }).website_url!
                : ""),
        company:
          typeof lead.organization_name === "string" && lead.organization_name
            ? lead.organization_name
            : (lead.organization && typeof lead.organization === "object" && typeof (lead.organization as { name?: string }).name === "string"
                ? (lead.organization as { name?: string }).name!
                : ""),
        headline: lead.headline,
        location: [lead.city, lead.state, lead.country].filter(Boolean).join(", "),
        phone_number:
          lead.organization && typeof lead.organization === "object" && typeof (lead.organization as { phone?: string }).phone === "string"
            ? (lead.organization as { phone?: string }).phone!
            : "",
      };
    });
    console.log("Standardized Leads:", standardizedLeads.length, "Standardized Leads:");

    // 3. Deduplicate per user (relax filter to only require email)
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("email")
      .eq("user_id", userId);
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    const existingEmails = new Set((existing || []).map((l: { email: string }) => l.email));
    const newLeads: Lead[] = standardizedLeads.filter(
      (lead: Lead) => lead.email && !existingEmails.has(lead.email)
    );
    console.log("New Leads:", newLeads.length, "New Leads:");

    // 4. Email verification (Reoon Bulk)
    const emailsToVerify = newLeads.map((lead) => lead.email).filter((email): email is string => Boolean(email));
    let verifiedLeads: Lead[] = [];
    if (emailsToVerify.length > 0) {
      // Step 1: Create bulk verification task
      const createTaskRes = await fetch(
        "https://emailverifier.reoon.com/api/v1/create-bulk-verification-task/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Apollo Bulk Verify",
            emails: emailsToVerify,
            key: reoonKey,
          }),
        }
      );
      const createTaskData: {
        status: string;
        task_id?: string | number;
        reason?: string;
      } = await createTaskRes.json();
      if (createTaskData.status !== "success" || !createTaskData.task_id) {
        return NextResponse.json({ error: createTaskData.reason || "Failed to create bulk verification task" }, { status: 500 });
      }
      const taskId = createTaskData.task_id;

      // Step 2: Poll for results
      let results: Record<string, { status: string } & Record<string, unknown>> | undefined;
      for (let i = 0; i < 60; i++) { // up to 2 minutes (2s interval)
        const res = await fetch(
          `https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task/?key=${reoonKey}&task_id=${taskId}`
        );
        const data: {
          status: string;
          results?: Record<string, { status: string } & Record<string, unknown>>;
        } = await res.json();
        if (data.status === "completed" && data.results) {
          results = data.results;
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!results) {
        return NextResponse.json({ error: "Bulk email verification timed out or failed." }, { status: 500 });
      }
      // Step 3: Filter leads by results (status === 'safe')
      verifiedLeads = newLeads.filter((lead) => {
        const result = results && lead.email ? results[lead.email] : undefined;
        return result && result.status === "safe";
      });
    }

    console.log("Verified Leads:", verifiedLeads.length, "Verified Leads:");

    // 5. Save to Supabase
    if (verifiedLeads.length > 0) {
      const upsertData = verifiedLeads.map((lead: Lead) => ({
        ...lead,
        user_id: userId,
      }));
      // Deduplicate by user_id and email
      const uniqueUpsertData = Array.from(
        new Map(
          upsertData.map(item => [`${item.user_id}:${item.email}`, item])
        ).values()
      );
      const { error: upsertError } = await supabase
        .from("leads")
        .upsert(uniqueUpsertData, { onConflict: "user_id,email" });
      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ leads: verifiedLeads });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.log("Error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
}
