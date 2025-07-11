import React from "react";

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
  return (
    <section className="w-full max-w-2xl bg-gradient-to-br from-white/90 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/90 md:rounded-2xl rounded-none shadow-xl mt-10 mb-4 p-6 flex flex-col items-center border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">API Keys (Optional)</h2>
      <form
        className="w-full flex flex-col gap-4 items-end"
        onSubmit={e => { e.preventDefault(); handleSaveKeys(); }}
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
        <button
          type="submit"
          className="h-10 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition self-end mb-1"
        >
          Save
        </button>
      </form>
      <div className="w-full text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        These keys are used only for your current session and are not stored.<br/>
        Leave blank to use the default keys provided by the app owner.
      </div>
    </section>
  );
} 