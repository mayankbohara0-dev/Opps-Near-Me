export type Category = "sports" | "internship" | "event" | "hackathon";
export type Status = "active" | "pending" | "expired" | "rejected";

export interface Opportunity {
  id: string;
  title: string;
  category: Category;
  description: string;
  location_city: string;
  location_area: string;
  organizer_name: string;
  contact_phone: string;
  contact_email: string;
  external_link?: string;
  deadline: string; // ISO date string
  event_date?: string;
  status: Status;
  created_at: string;
  updated_at: string;
  eligibility?: string;
  requirements?: string;
  what_offered?: string;
}

export const TOP_INDIAN_CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
  "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", 
  "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", 
  "Vasai-Virar", "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", 
  "Howrah", "Ranchi", "Gwalior", "Jabalpur", "Coimbatore", "Vijayawada", "Jodhpur", "Madurai", "Raipur", 
  "Kota", "Guwahati", "Chandigarh", "Solapur", "Mysuru", "Tiruchirappalli", "Gurgaon", "Bhubaneswar", "Salem", 
  "Warangal", "Thiruvananthapuram", "Bhiwandi", "Noida", "Jamshedpur", "Kochi", "Dehradun", "Udaipur", "Patiala"
];

export const OPPORTUNITIES: Opportunity[] = [];

export const CATEGORY_META: Record<
  Category,
  { label: string; emoji: string; color: string; bg: string }
> = {
  sports: { label: "Sports Trials", emoji: "🏏", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/30" },
  internship: { label: "Internships", emoji: "💼", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  event: { label: "Events", emoji: "🎤", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  hackathon: { label: "Hackathons", emoji: "💻", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
};

export function getDaysUntilDeadline(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline);
  dead.setHours(0, 0, 0, 0);
  return Math.ceil((dead.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isUrgent(deadline: string): boolean {
  return getDaysUntilDeadline(deadline) <= 3 && getDaysUntilDeadline(deadline) >= 0;
}
