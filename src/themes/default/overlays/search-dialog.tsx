// packages/docs/src/themes/default/overlays/search-dialog.tsx
import { For, Show, type Component } from "solid-js";
import { CommandDialog } from "@/components/ui/command";
import { CommandInput } from "@/components/ui/command";
import { CommandList } from "@/components/ui/command";
import { CommandEmpty } from "@/components/ui/command";
import { CommandGroup } from "@/components/ui/command";
import { CommandItem } from "@/components/ui/command";
import { FileText } from "lucide-solid";
import type { DocsSearchDialogProps } from "../../types.js";
import { resolveSearchProvider, searchPages } from "../../../search/provider.js";

export const DocsSearchDialog: Component<DocsSearchDialogProps> = (props) => {
  const handleOpenChange = (open: boolean) => {
    props.onOpenChange(open);
  };

  const handleSelect = (url: string) => {
    handleOpenChange(false);
    if (props.onSelectPage) {
      props.onSelectPage(url);
    } else if (typeof window !== "undefined") {
      window.location.href = url;
    }
  };

  return (
    <CommandDialog
      open={props.open}
      onOpenChange={handleOpenChange}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLInputElement>("#docs-search-input")?.focus();
        });
      }}
      enableHotkey={props.provider !== undefined}
    >
      {({ search }) => {
        const query = () => search().trim();
        const resolvedProvider = () => resolveSearchProvider({ provider: props.provider });
        const filteredPages = () => searchPages(resolvedProvider(), query(), props.pages || []);

        return (
          <>
            <CommandInput id="docs-search-input" placeholder="Search documentation..." />
            <CommandList>
              <Show when={query().length > 0 && filteredPages().length === 0}>
                <CommandEmpty>No matching documents found.</CommandEmpty>
              </Show>
              <Show when={filteredPages().length > 0}>
                <CommandGroup heading="Pages">
                  <For each={filteredPages()}>
                    {(page) => (
                      <CommandItem
                        title={page.title}
                        subtitle={page.url}
                        description={page.description}
                        icon={FileText}
                        shouldFilter={false}
                        onSelect={() => handleSelect(page.url)}
                      />
                    )}
                  </For>
                </CommandGroup>
              </Show>
            </CommandList>
          </>
        );
      }}
    </CommandDialog>
  );
};
