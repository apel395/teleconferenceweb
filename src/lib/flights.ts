export type FlightSegment={from:string;to:string;from_country:string;to_country:string;airline:string;flight_number:string;departure_at:string;arrival_at:string;departure_timezone:string;arrival_timezone:string;purpose:'TRANSIT'|'VISIT'|'UMRAH'|'HOME'};
export function localFlightTime(value:string,zone:string):string{
 if(!value)return '';if(!/[Z]|[+-]\d\d:\d\d$/.test(value))return value;
 try{const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value)).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}catch{return '';}
}
// Wall time is entered in the airport's zone, independent of the inspector's device zone.
export function flightInstant(value:string,zone:string):string{
 if(!value)throw Error('Lengkapi tanggal dan jam setiap penerbangan.');
 if(/[Z]|[+-]\d\d:\d\d$/.test(value)){if(!Number.isFinite(Date.parse(value)))throw Error('Waktu penerbangan tidak valid.');new Intl.DateTimeFormat('en',{timeZone:zone});return new Date(value).toISOString();}
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Waktu penerbangan tidak valid.');
 const wall=Date.parse(value+'Z');let guess=wall;
 for(let i=0;i<4;i++){const actual=localFlightTime(new Date(guess).toISOString(),zone);if(!actual)throw Error('Zona waktu tidak dikenal.');const delta=wall-Date.parse(actual+'Z');if(!delta)break;guess+=delta;}
 if(localFlightTime(new Date(guess).toISOString(),zone)!==value)throw Error('Jam tersebut tidak tersedia pada zona waktu yang dipilih.');
 return new Date(guess).toISOString();
}
export function canonicalFlights(segments:FlightSegment[]=[]):FlightSegment[]{return segments.map(s=>({...s,from:s.from.trim().toUpperCase(),to:s.to.trim().toUpperCase(),from_country:s.from_country.trim().toUpperCase(),to_country:s.to_country.trim().toUpperCase(),departure_at:flightInstant(s.departure_at,s.departure_timezone),arrival_at:flightInstant(s.arrival_at,s.arrival_timezone)}));}
