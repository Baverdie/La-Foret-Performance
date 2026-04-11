'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Hero from '@/components/Hero';
import Crew from '@/components/Crew';
import Garage from '@/components/Garage';
import Sorties from '@/components/Sorties';
import Footer from '@/components/Footer';
import type { PublicMember, PublicCar, PublicEvent } from '@/lib/data';

gsap.registerPlugin(ScrollTrigger);

interface HomeClientProps {
  members: PublicMember[];
  cars: PublicCar[];
  events: PublicEvent[];
}

export default function HomeClient({ members, cars, events }: HomeClientProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const [selectedMember, setSelectedMember] = useState<PublicMember | null>(null);
  const [selectedCar, setSelectedCar] = useState<PublicCar | null>(null);

  useEffect(() => {
    const sections = gsap.utils.toArray('.section-reveal');

    sections.forEach((section: any) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          end: 'bottom 20%',
          toggleActions: 'play none none reverse',
        },
        opacity: 0,
        y: 100,
        duration: 1,
        ease: 'power3.out',
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const smoothScrollTo = (targetY: number, duration = 1200, onComplete?: () => void) => {
    const startY = window.scrollY;
    const delta = targetY - startY;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + delta * eased);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        onComplete?.();
      }
    };

    requestAnimationFrame(step);
  };

  const openMemberFromCar = (ownerInstagram: string, ownerName: string) => {
    const member = members.find((m) => m.instagram === ownerInstagram || m.name === ownerName);
    if (!member) return;
    setSelectedMember(null);
    setSelectedCar(null);
    const closeDuration = 300;
    const extraDelay = 400;
    window.setTimeout(() => {
      const target = document.getElementById(`member-${member.id}`);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
      const distance = Math.abs(targetY - window.scrollY);
      const scrollDuration = Math.min(700, Math.max(300, distance * 0.35));
      smoothScrollTo(targetY, scrollDuration);
      const openDelay = closeDuration + scrollDuration + extraDelay;
      window.setTimeout(() => setSelectedMember(member), openDelay);
    }, 0);
  };

  const openCarFromMember = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    if (!car) return;
    setSelectedCar(null);
    setSelectedMember(null);
    const closeDuration = 300;
    const extraDelay = 400;
    window.setTimeout(() => {
      const target = document.getElementById(`car-${car.id}`);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - window.innerHeight / 2 + rect.height / 2;
      const distance = Math.abs(targetY - window.scrollY);
      const scrollDuration = Math.min(700, Math.max(300, distance * 0.35));
      smoothScrollTo(targetY, scrollDuration);
      const openDelay = closeDuration + scrollDuration + extraDelay + 10;
      window.setTimeout(() => setSelectedCar(car), openDelay);
    }, 0);
  };

  return (
    <div ref={mainRef} className="relative">
      <Hero />
      {members.length > 0 && (
        <Crew
          members={members}
          selectedMember={selectedMember}
          onSelectMember={setSelectedMember}
          onCloseMember={() => setSelectedMember(null)}
          onOpenCar={openCarFromMember}
        />
      )}
      {cars.length > 0 && (
        <Garage
          cars={cars}
          selectedCar={selectedCar}
          onSelectCar={setSelectedCar}
          onCloseCar={() => setSelectedCar(null)}
          onOpenOwner={openMemberFromCar}
        />
      )}
      {events.length > 0 && <Sorties events={events} />}
      <Footer />
    </div>
  );
}
