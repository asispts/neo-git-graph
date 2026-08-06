import { Button } from "@/webview/components/ui/Button";
import { Icon } from "@/webview/components/ui/Icons";
import { Select } from "@/webview/components/ui/Select";
import type { ReadyRepositoryState } from "@/webview/types/repo";

export function MainHeader({ state }: { state: ReadyRepositoryState }) {
  return (
    <header class="flex justify-center border-b border-line py-4 gap-x-8">
      <Button>
        <Icon>
          <path d="M3 8C3 5.23858 5.23858 3 8 3C9.63527 3 11.0878 3.78495 12.0005 5H10C9.72386 5 9.5 5.22386 9.5 5.5C9.5 5.77614 9.72386 6 10 6H12.8904C12.8973 6.00014 12.9041 6.00014 12.911 6H13C13.2761 6 13.5 5.77614 13.5 5.5V2.5C13.5 2.22386 13.2761 2 13 2C12.7239 2 12.5 2.22386 12.5 2.5V4.03138C11.4009 2.78613 9.79253 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.1301 14 13.6999 11.6035 13.9756 8.54488C14.0003 8.26985 13.7975 8.0268 13.5225 8.00202C13.2474 7.97723 13.0044 8.1801 12.9796 8.45512C12.75 11.003 10.6079 13 8 13C5.23858 13 3 10.7614 3 8Z" />
        </Icon>
      </Button>
      <div>
        {state.repos.length > 1 && (
          <Select
            label="Repo:"
            options={state.repos}
            value={state.selectedRepo.value}
            onChange={(e) => {
              state.selectedRepo =
                state.repos.find((repo) => repo.value === e.currentTarget.value) ??
                state.selectedRepo;
            }}
          />
        )}
      </div>
    </header>
  );
}
