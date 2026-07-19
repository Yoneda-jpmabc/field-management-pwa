import { PageHeader } from "@/components/ui/PageHeader";
import { IconPlus } from "@/components/icons";
import { FieldsBrowser } from "@/components/fields/FieldsBrowser";
import { fields } from "@/lib/mock-data";

export default function FieldsPage() {
  return (
    <>
      <PageHeader
        title="圃場"
        description={`登録されている圃場は${fields.length}筆です。`}
        actions={
          <button
            type="button"
            className="control-focus flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <IconPlus className="h-4 w-4" />
            圃場を追加
          </button>
        }
      />
      <FieldsBrowser fields={fields} />
    </>
  );
}
