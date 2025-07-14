import { NextRequest, NextResponse } from "next/server";

// Function to validate Apify API key
async function validateApifyKey(apifyKey: string): Promise<{ valid: boolean; error?: string; userInfo?: Record<string, unknown> }> {
  try {
    const response = await fetch("https://api.apify.com/v2/users/me", {
      headers: {
        "Authorization": `Bearer ${apifyKey}`,
        "Content-Type": "application/json"
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return { valid: true, userInfo: userData };
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

// Function to validate Reoon API key
async function validateReoonKey(reoonKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch("https://emailverifier.reoon.com/api/v1/check-credits/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: reoonKey })
    });
    const data = await response.json();
    console.log('Reoon API response:', data);

    if (response.ok) {
      if (data.status === "success") {
        return { valid: true };
      } else {
        return { valid: false, error: data.reason || "Invalid API key" };
      }
    } else {
      return { valid: false, error: "Failed to validate Reoon API key" };
    }
  } catch {
    return { valid: false, error: "Network error while validating Reoon API key" };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apifyKey, reoonKey } = await req.json();

    const results: {
      apify?: { valid: boolean; error?: string; userInfo?: Record<string, unknown> };
      reoon?: { valid: boolean; error?: string };
    } = {};

    // Validate Apify key if provided
    if (apifyKey) {
      results.apify = await validateApifyKey(apifyKey);
    }

    // Validate Reoon key if provided
    if (reoonKey) {
      results.reoon = await validateReoonKey(reoonKey);
    }

    // Check if any keys are invalid
    const hasInvalidKeys = Object.values(results).some(result => result && !result.valid);

    return NextResponse.json({
      success: !hasInvalidKeys,
      results,
      message: hasInvalidKeys 
        ? "Some API keys are invalid. Please check and try again." 
        : "All provided API keys are valid!"
    });

  } catch {
    return NextResponse.json({ 
      error: "Failed to validate API keys" 
    }, { status: 500 });
  }
} 