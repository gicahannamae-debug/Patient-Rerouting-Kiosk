'use client'
import React from 'react';

const navItems = [
  { key: 'triage', label: 'Triage Form |' },
  { key: 'vitals', label: 'Vital Signs |' },
  { key: 'chief', label: 'Chief Complaints |' },
  { key: 'summary', label: 'Summary |' },
];

const navBackgrounds: Record<'yellow' | 'orange', string> = {
  yellow: 'bg-yellow-50',
  orange: 'bg-orange-50',
};

export const pageWrapperClasses = 'min-h-screen flex flex-col gap-[1.5rem] items-center justify-center bg-cyan-950 py-[3rem]';
export const contentCardClasses = 'flex flex-row gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]';
export const formCardClasses = 'flex flex-col gap-[1.2rem] bg-cyan-900 px-[2.5rem] py-[2rem] rounded-xl w-[70rem]';
export const formFieldClasses = 'text-[1rem] text-cyan-950 border border-stone-300 bg-orange-50 rounded-sm px-[0.5rem] py-[0.4rem] focus:outline-none focus:ring-2 focus:ring-orange-300';
export const primaryButtonClasses = 'text-[1.1rem] font-semibold bg-orange-50 text-cyan-950 px-[2.5rem] py-[0.5rem] rounded-md hover:bg-orange-100 cursor-pointer';
export const secondaryButtonClasses = 'text-[1rem] font-semibold bg-transparent text-orange-50 border border-orange-100 px-[1.5rem] py-[0.5rem] rounded-md hover:bg-cyan-800 cursor-pointer';
export const resultCardClasses = 'rounded-lg border border-cyan-600 bg-cyan-900 p-[1rem] text-white';

export function NavBar({
  activeItem,
  variant = 'yellow',
  hideLinks = false,
}: {
  activeItem?: string;
  variant?: 'yellow' | 'orange';
  hideLinks?: boolean;
}) {
  const bgClass = navBackgrounds[variant];

  return (
    <nav className={`w-full pl-[2rem] pt-[1rem] pb-[1rem] pr-[2rem] text-cyan-950 ${bgClass}`}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">BICA</h1>
          <p className="w-full">Better Informed Care Access</p>
        </div>

        {!hideLinks && (
          <div className="pr-[2rem]">
            <ul className="md:flex space-x-8 hidden text-xl font-semibold w-full">
              {navItems.map((item) => (
                <li key={item.key}>
                  <a
                    href="#"
                    className={`cursor-pointer hover:underline ${activeItem === item.label ? 'text-orange-600 underline' : 'text-cyan-950'}`}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="md:hidden">
              <a className="text-4xl font-semibold" href="#">
                &#8801;
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col text-center justify-center">
      <h1 className="text-[3rem] font-bold text-white">{title}</h1>
      <p className="text-[1.7rem] font-serif text-white">{subtitle}</p>
    </div>
  );
}
