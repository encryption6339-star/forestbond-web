import { PageHeader } from "@/components/PageHeader";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="placeholder-box">
        <p>이 페이지는 준비 중입니다.</p>
        <p className="mt-2 text-sm">FORESTBOND 원본 기능을 순차적으로 이전할 예정입니다.</p>
      </div>
    </>
  );
}
