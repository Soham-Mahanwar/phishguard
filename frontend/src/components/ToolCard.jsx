export default function ToolCard({ icon: Icon, title, description }) {
  return (
    <div className="p-5 border border-doc-outline-variant rounded-xl bg-white hover:border-doc-primary transition-colors group">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 flex items-center justify-center bg-doc-primary-fixed rounded-lg">
          <Icon className="text-doc-primary" size={20} />
        </div>
        <h4 className="font-headline text-doc-headline-sm text-doc-on-surface">{title}</h4>
      </div>
      <p className="font-body text-doc-body-sm text-doc-on-surface-variant">{description}</p>
    </div>
  );
}
