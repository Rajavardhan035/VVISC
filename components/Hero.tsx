import React from 'react';
import { LogoSequence } from './LogoSequence';

interface HeroProps {
  onOpenJoinModal?: () => void;
  onSequenceReady?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSequenceReady }) => {
  return (
    <section className="relative w-full bg-[#eee8dc]">
      {/* Cinematic Sticky Canvas Sequence with Clean Logo Hold */}
      <LogoSequence
        onSequenceReady={onSequenceReady}
      />
    </section>
  );
};

export default Hero;
