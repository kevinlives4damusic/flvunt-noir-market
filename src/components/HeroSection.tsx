import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        src="/images/FLVUNTT.mp4"
      />
      <div className="absolute inset-0 bg-black/20" /> {/* Optional overlay for better text visibility */}
    </div>
  );
};

export default HeroSection;
