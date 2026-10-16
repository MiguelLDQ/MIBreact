import { initials } from '../utils/format';

export const Icon = ({ name, style, className = '' }) => (
  <span className={'material-symbols-outlined ' + className} style={style}>{name}</span>
);
export const Spin = () => <div className="spinner-lg" />;
export const Empty = ({ icon, children }) => (
  <div className="empty">{icon && <Icon name={icon} />}{children}</div>
);
export function Async({ res, children }) {
  if (res.loading) return <Spin />;
  if (res.error) return <Empty icon="error">{res.error.message || 'Erro ao carregar.'}</Empty>;
  return children(res.data);
}
export const Avatar = ({ name, url, large, style }) => (
  <div className={'avatar' + (large ? ' avatar-lg' : '')} style={style}>
    {url ? <img src={url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials(name)}
  </div>
);
export const Card = ({ title, icon, children, style }) => (
  <div className="card" style={style}>
    {title && <div className="card-title">{icon && <Icon name={icon} />}{title}</div>}
    {children}
  </div>
);
export const ViewHeader = ({ icon, title, children }) => (
  <div className="view-header">
    <h2><Icon name={icon} />{title}</h2>
    {children && <p>{children}</p>}
  </div>
);
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(([id, label]) => (
      <button key={id} className={'tab' + (value === id ? ' active' : '')} onClick={() => onChange(id)}>{label}</button>
    ))}
  </div>
);
