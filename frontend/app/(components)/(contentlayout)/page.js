"use client";
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import Seo from '@/shared/layout-components/seo/seo';

const CARD_STYLES = {
  primary: { gradient: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', icon: '#6366f1', border: 'rgba(99,102,241,0.4)' },
  success: { gradient: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)', icon: '#22c55e', border: 'rgba(34,197,94,0.4)' },
  warning: { gradient: 'linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.05) 100%)', icon: '#fbbf24', border: 'rgba(251,191,36,0.4)' },
  info: { gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.05) 100%)', icon: '#8b5cf6', border: 'rgba(139,92,246,0.4)' },
};

export default function Home() {
  const sections = [
    {
      title: 'Medical Signals',
      desc: 'ECG & EEG multi-channel visualization with AI and classic ML detection',
      links: [
        { href: '/signal-viewer/medical/ecg/', label: 'ECG Viewer' },
        { href: '/signal-viewer/medical/eeg/', label: 'EEG Viewer' },
      ],
      icon: 'ri-heart-pulse-line',
      style: 'primary',
    },
    {
      title: 'Acoustic Signals',
      desc: 'Vehicle Doppler synthesis, velocity/frequency estimation, drone detection',
      links: [
        { href: '/signal-viewer/acoustic/doppler/', label: 'Vehicle Doppler' },
        { href: '/signal-viewer/acoustic/drones/', label: 'Drones/Submarine' },
      ],
      icon: 'ri-sound-module-line',
      style: 'success',
    },
    {
      title: 'Trading Signals',
      desc: 'Stock market, currencies, minerals — visualization and prediction',
      links: [
        { href: '/signal-viewer/trading/stocks/', label: 'Stocks' },
        { href: '/signal-viewer/trading/currencies/', label: 'Currencies' },
        { href: '/signal-viewer/trading/minerals/', label: 'Minerals' },
      ],
      icon: 'ri-line-chart-line',
      style: 'warning',
    },
    {
      title: 'Microbiome',
      desc: 'Bacterial/disease profiling from iHMP, iPOP datasets',
      links: [
        { href: '/signal-viewer/microbiome/', label: 'Microbiome Viewer' },
      ],
      icon: 'ri-microscope-line',
      style: 'info',
    },
  ];

  return (
    <>
      <Seo title="Signal Viewer" />
      <div className="text-center mb-5 pb-2">
        <h1 className="fw-bold mb-2" style={{ fontSize: '2rem', letterSpacing: '0.02em' }}>
          Team#16 Signal Viewer
        </h1>
        <p className="text-muted mb-0 mx-auto" style={{ maxWidth: 520, fontSize: '1rem' }}>
          Medical, acoustic, trading & microbiome signal processing in one place
        </p>
      </div>

      <Row className="justify-content-center g-4">
        {sections.map((s, i) => {
          const st = CARD_STYLES[s.style];
          return (
            <Col key={i} xs={12} sm={6} lg={6} xl={3} className="d-flex">
              <Card
                className="custom-card border-0 shadow-lg flex-fill overflow-hidden"
                style={{
                  background: st.gradient,
                  borderLeft: `4px solid ${st.border}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(99,102,241,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <Card.Body className="d-flex flex-column h-100 py-4 px-4">
                  <div
                    className="rounded-3 d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: 52, height: 52, background: `${st.icon}22` }}
                  >
                    <i className={`ri ${s.icon}`} style={{ fontSize: '1.75rem', color: st.icon }}></i>
                  </div>
                  <h5 className="fw-bold mb-2" style={{ color: 'rgba(255,255,255,0.95)' }}>{s.title}</h5>
                  <p className="text-muted mb-4 flex-grow-1" style={{ fontSize: '0.9rem', lineHeight: 1.5, minHeight: '2.7em' }}>
                    {s.desc}
                  </p>
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    {s.links.map((l, j) => (
                      <Link
                        key={j}
                        href={l.href}
                        className="btn btn-sm border"
                        style={{
                          borderColor: st.border,
                          color: st.icon,
                          backgroundColor: 'transparent',
                        }}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </>
  );
}
