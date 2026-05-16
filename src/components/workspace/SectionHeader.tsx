interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-pretendard text-title2 font-semibold text-gray-900 m-0">
        {title}
      </h2>
      {action}
    </div>
  );
}
