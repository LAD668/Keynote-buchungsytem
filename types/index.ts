export type TicketId = string;

export interface Workshop {
  id: string;
  speaker: string;
  room: string;
  time_slot: 1 | 2 | 3;
  description?: string;
  title: string;
}

export interface Booking {
  id: string;
  ticketId: TicketId;
  workshopId: Workshop["id"];
}
