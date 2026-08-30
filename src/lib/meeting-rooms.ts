export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
}

// รายการห้องที่สามารถจองผ่านระบบได้
export const MEETING_ROOMS: MeetingRoom[] = [
  { id: "medium-meeting-room", name: "ห้องประชุมขนาดกลาง", capacity: 30 },
  { id: "tri-building-floor-2", name: "ห้องประชุมไตรอาคาร ชั้น 2", capacity: 50 },
  { id: "audiovisual-building-6-floor-2", name: "ห้องโสตทัศนศึกษา อาคาร 6 ชั้น 2", capacity: 80 },
  { id: "room-322-building-3-floor-2", name: "ห้อง 322 อาคาร 3 ชั้น 2", capacity: 25 },
  { id: "multipurpose-meeting-room", name: "ห้องประชุมอเนกประสงค์", capacity: 100 },
];

export const ONLINE_PARTICIPANT_LIMIT = 100;

export function getMeetingRoom(roomId?: string) {
  return MEETING_ROOMS.find((room) => room.id === roomId);
}
