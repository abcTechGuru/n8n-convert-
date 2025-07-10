import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export function ApolloForm({ onScrape, loading }: { onScrape: (url: string) => void, loading: boolean }) {
    const [url, setUrl] = useState("");
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          onScrape(url);
        }}
        className="space-y-4 w-full"
      >
        <Input
          placeholder="Apollo Search URL"
          value={url}
          onChange={e => setUrl(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Scraping..." : "Start Apollo Scraping"}
        </Button>
      </form>
    );
  }
  