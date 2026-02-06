import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * GravityContainer - Wrapper component that makes children "fall" into place
 * using GSAP physics-based animations
 */
export default function GravityContainer({ children, delay = 0, className = '' }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const elements = containerRef.current.children;

        // Set initial state - elements start above viewport
        gsap.set(elements, {
            y: -100,
            opacity: 0,
            rotation: -5
        });

        // Animate elements falling into place with gravity effect
        gsap.to(elements, {
            y: 0,
            opacity: 1,
            rotation: 0,
            duration: 1.2,
            ease: 'bounce.out',
            stagger: {
                amount: 0.6,
                from: 'start'
            },
            delay: delay
        });
    }, [delay]);

    return (
        <div ref={containerRef} className={className}>
            {children}
        </div>
    );
}
