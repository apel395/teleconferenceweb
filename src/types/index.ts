import type {LucideIcon} from 'lucide-react';
export type Service={slug:string;title:string;category:'Haji'|'Umrah'|'Dokumen'|'Umum';description:string;duration:string;method:string;requirements:string;icon:LucideIcon};
export type Article={slug:string;category:string;date:string;title:string;summary:string;content:string[]};
export type ConsultationState={service:string;name:string;whatsapp:string;email:string;city:string;organization:string;title:string;description:string;date:string;time:string;method:string};
