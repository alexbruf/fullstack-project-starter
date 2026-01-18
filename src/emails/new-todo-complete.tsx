interface EmailTemplateProps {
  title: string;
}

export function EmailTemplate({ title }: EmailTemplateProps) {
  return (
    <div>
      <h1>Complete: {title}!</h1>
    </div>
  );
}
