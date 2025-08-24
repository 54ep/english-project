declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    color?: string;
    size?: number | string;
    absoluteStrokeWidth?: boolean;
    className?: string;
  }
  export const Plus: React.FC<LucideProps>;
  export const Brain: React.FC<LucideProps>;
  export const List: React.FC<LucideProps>;
  export const Trash2: React.FC<LucideProps>;
  export const Edit3: React.FC<LucideProps>;
  export const Check: React.FC<LucideProps>;
  export const X: React.FC<LucideProps>;
  export const Search: React.FC<LucideProps>;
  export const AlertCircle: React.FC<LucideProps>;
  export const Wifi: React.FC<LucideProps>;
  export const WifiOff: React.FC<LucideProps>;
}
