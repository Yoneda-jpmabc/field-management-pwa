import { PageHeader } from "@/components/ui/PageHeader";
import { FieldsBrowser } from "@/components/fields/FieldsBrowser";
import { fetchFields } from "@/lib/fields/queries";

export const dynamic = "force-dynamic";

export default async function FieldsPage() {
  const { items, errorMessage } = await fetchFields();

  return (
    <>
      <PageHeader
        title="圃場"
        description={`登録されている圃場は${items.length}筆です。`}
      />

      {errorMessage && (
        <p className="mb-4 rounded-[10px] bg-danger-bg px-4 py-3 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <FieldsBrowser fields={items} />
    </>
  );
}
