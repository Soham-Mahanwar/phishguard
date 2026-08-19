export default function GlassCard({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={`glass-card ${className}`} {...props}>
      {children}
    </Tag>
  );
}
