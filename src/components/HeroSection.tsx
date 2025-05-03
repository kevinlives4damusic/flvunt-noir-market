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
        src="/images/hero/FLVUNTT.mp4"
      />
    </div>
  );
};

export default HeroSection;
