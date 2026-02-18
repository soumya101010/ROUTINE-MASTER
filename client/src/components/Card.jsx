import './Card.css';

export default function Card({ children, className = '', onClick, hover = true, color = '' }) {
    return (
        <div
            className={`glass-card ${color} ${hover ? 'card-hover' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
