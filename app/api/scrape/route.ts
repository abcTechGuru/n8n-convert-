import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  [key: string]: any;
}

export async function POST(req: NextRequest) {
  const { apolloUrl, userId } = await req.json();
  // console.log("Apollo URL:", process.env.APIFY_API_KEY);

  if (!apolloUrl || !userId) {
    return NextResponse.json({ error: "Missing Apollo URL or user ID" }, { status: 400 });
  }

  try {
    // 1. Call Apify Scraper

    const apifyRes = await fetch(
      "https://api.apify.com/v2/acts/code_crafter~apollo-io-scraper/run-sync-get-dataset-items?format=json&clean=true",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.APIFY_API_KEY}`,
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
      return NextResponse.json({ error }, { status: 500 });
    }

    const leads: Lead[] = await apifyRes.json();
    // console.log("Raw Leads:", leads);

    // 2. Standardize fields (handle nested fields)
    const standardizedLeads: Lead[] = leads.map((lead: any) => ({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      website_url: lead.organization_website_url || (lead.organization && lead.organization.website_url) || "",
      company: lead.organization_name || (lead.organization && lead.organization.name) || "",
      headline: lead.headline,
      location: [lead.city, lead.state, lead.country].filter(Boolean).join(", "),
      phone_number: (lead.organization && lead.organization.phone) || "",
    }));
    console.log("Standardized Leads:", standardizedLeads.length, "Standardized Leads:");

    // 3. Deduplicate per user (relax filter to only require email)
    const { data: existing, error: fetchError } = await supabase
      .from("leads")
      .select("email")
      .eq("user_id", userId);
    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    const existingEmails = new Set((existing || []).map((l: any) => l.email));
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
            key: process.env.REOON_API_KEY,
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
          `https://emailverifier.reoon.com/api/v1/get-result-bulk-verification-task/?key=${process.env.REOON_API_KEY}&task_id=${taskId}`
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
  } catch (err: any) {
    console.log("Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
