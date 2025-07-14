import React, { useState } from "react";

interface APIKeysSectionProps {
  apifyInput: string;
  setApifyInput: (v: string) => void;
  showApify: boolean;
  setShowApify: (v: boolean) => void;
  reoonInput: string;
  setReoonInput: (v: string) => void;
  showReoon: boolean;
  setShowReoon: (v: boolean) => void;
  handleSaveKeys: () => void;
}

export default function APIKeysSection({
  apifyInput,
  setApifyInput,
  showApify,
  setShowApify,
  reoonInput,
  setReoonInput,
  showReoon,
  setShowReoon,
  handleSaveKeys,
}: APIKeysSectionProps) {
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    results?: {
      apify?: { valid: boolean; error?: string; userInfo?: Record<string, unknown> };
      reoon?: { valid: boolean; error?: string };
    };
  } | null>(null);
  const [saved, setSaved] = useState(false);

  const handleValidateKeys = async () => {
    if (!apifyInput && !reoonInput) {
      setValidationResult({
        success: false,
        message: "Please enter at least one API key to validate."
      });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch("/api/validate-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apifyKey: apifyInput || undefined,
          reoonKey: reoonInput || undefined,
        }),
      });

      const data = await response.json();
      setValidationResult(data);
    } catch {
      setValidationResult({
        success: false,
        message: "Failed to validate API keys. Please try again."
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveKeys();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="w-full max-w-2xl bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 md:rounded-2xl rounded-none shadow-xl mt-10 mb-4 p-6 flex flex-col items-center border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">API Keys (Optional)</h2>
      <form
        className="w-full flex flex-col gap-4 items-end"
        onSubmit={handleSave}
      >
        <div className="flex-1 flex flex-col w-full">
          <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="apify-key">APIFY_API_KEY</label>
          <div className="relative">
            <input
              id="apify-key"
              type={showApify ? "text" : "password"}
              value={apifyInput}
              onChange={e => setApifyInput(e.target.value)}
              placeholder="Enter your Apify API Key"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowApify(!showApify)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
              tabIndex={-1}
              aria-label={showApify ? "Hide Apify key" : "Show Apify key"}
            >
              {showApify ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col w-full">
          <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="reoon-key">REOON_API_KEY</label>
          <div className="relative">
            <input
              id="reoon-key"
              type={showReoon ? "text" : "password"}
              value={reoonInput}
              onChange={e => setReoonInput(e.target.value)}
              placeholder="Enter your Reoon API Key"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowReoon(!showReoon)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
              tabIndex={-1}
              aria-label={showReoon ? "Hide Reoon key" : "Show Reoon key"}
            >
              {showReoon ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
        
        <div className="flex gap-2 self-end">
          <button
            type="button"
            onClick={handleValidateKeys}
            disabled={validating || (!apifyInput && !reoonInput)}
            className="h-10 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold shadow transition"
          >
            {validating ? "Validating..." : "Validate Keys"}
          </button>
          <button
            type="submit"
            className="h-10 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition"
            disabled={saved}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </form>

      {/* Validation Results */}
      {validationResult ? (
        <div className={`w-full mt-4 p-4 rounded-lg ${
          validationResult.success 
            ? 'bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700' 
            : 'bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
        }`}>
          <div className={`font-semibold ${
            validationResult.success 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-red-800 dark:text-red-200'
          }`}>
            {validationResult.message}
          </div>
          
          {validationResult.results && (
            <div className="mt-2 space-y-2 text-sm">
              {validationResult.results.apify && (
                <div className={`p-2 rounded ${
                  validationResult.results.apify.valid 
                    ? 'bg-green-50 dark:bg-green-900/10' 
                    : 'bg-red-50 dark:bg-red-900/10'
                }`}>
                  <div className="font-medium">Apify API Key:</div>
                  <div className={validationResult.results.apify.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {validationResult.results.apify.valid ? ' Valid' : ` ${validationResult.results.apify.error}`}
                  </div>
                  {validationResult.results.apify.valid && validationResult.results.apify.userInfo && (() => {
                      let username = 'Unknown';
                      const userInfo = validationResult.results.apify.userInfo;
                      if (
                        userInfo.data &&
                        typeof userInfo.data === 'object' &&
                        userInfo.data !== null &&
                        'username' in userInfo.data &&
                        typeof (userInfo.data as { username?: string }).username === 'string'
                      ) {
                        username = (userInfo.data as { username?: string }).username as string;
                      } else if (typeof userInfo.username === 'string') {
                        username = userInfo.username;
                      }
                      let profileName = '';
                      if (
                        userInfo.data &&
                        typeof userInfo.data === 'object' &&
                        userInfo.data !== null &&
                        'profile' in userInfo.data &&
                        userInfo.data.profile &&
                        typeof userInfo.data.profile === 'object' &&
                        'name' in userInfo.data.profile &&
                        typeof (userInfo.data.profile as { name?: string }).name === 'string'
                      ) {
                        profileName = (userInfo.data.profile as { name?: string }).name as string;
                      }
                      return (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Username: {username}<br />
                          {profileName && <>Profile Name: {profileName}</>}
                        </div>
                      );
                    })()}
                </div>
              )}
              
              {validationResult.results.reoon && (
                <div className={`p-2 rounded ${
                  validationResult.results.reoon.valid 
                    ? 'bg-green-50 dark:bg-green-900/10' 
                    : 'bg-red-50 dark:bg-red-900/10'
                }`}>
                  <div className="font-medium">Reoon API Key:</div>
                  <div className={validationResult.results.reoon.valid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {validationResult.results.reoon.valid ? ' Valid' : ` ${validationResult.results.reoon.error}`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div className="w-full text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        These keys are used only for your current session and are not stored.<br/>
        Leave blank to use the default keys provided by the app owner.
      </div>
    </section>
  );
} 