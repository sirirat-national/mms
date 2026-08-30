export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number;
  category: "online" | "onsite";
  description: string;
  equipment: string[];
}

// รายการห้องที่สามารถจองผ่านระบบได้
export const MEETING_ROOMS: MeetingRoom[] = [
  {
    id: "medium-meeting-room",
    name: "ห้องประชุมขนาดกลาง",
    capacity: 40,
    category: "online",
    description: "ห้องประชุมออนไลน์ 1",
    equipment: ["จอแสดงผล", "กล้อง", "ไมโครโฟน", "ลำโพง"],
  },
  {
    id: "auditorium-building-floor-2",
    name: "ห้องประชุมโสตอาคาร ชั้น 2",
    capacity: 100,
    category: "online",
    description: "ห้องประชุมออนไลน์ 2",
    equipment: ["จอโปรเจกเตอร์", "กล้อง", "ไมโครโฟน", "ลำโพง"],
  },
  {
    id: "audiovisual-building-6-floor-2",
    name: "ห้องโสตทัศนศึกษา อาคาร 6 ชั้น 2",
    capacity: 80,
    category: "onsite",
    description: "ห้องประชุม On-site 1",
    equipment: ["จอโปรเจกเตอร์", "ไมโครโฟน", "ลำโพง"],
  },
  {
    id: "room-322-building-3-floor-2",
    name: "ห้อง 322 อาคาร 3 ชั้น 2",
    capacity: 30,
    category: "onsite",
    description: "ห้องประชุม On-site 2",
    equipment: ["จอแสดงผล", "ไวท์บอร์ด"],
  },
  {
    id: "small-meeting-room",
    name: "ห้องประชุมขนาดเล็ก",
    capacity: 15,
    category: "onsite",
    description: "ห้องประชุม On-site 3",
    equipment: ["จอแสดงผล", "ไวท์บอร์ด"],
  },
];

export const ONLINE_PARTICIPANT_LIMIT = 10;

export function getMeetingRoom(roomId?: string) {
  const legacyRoomIds: Record<string, string> = {
    "tri-building-floor-2": "auditorium-building-floor-2",
    "multipurpose-meeting-room": "small-meeting-room",
  };
  const normalizedId = roomId ? legacyRoomIds[roomId] ?? roomId : undefined;
  return MEETING_ROOMS.find((room) => room.id === normalizedId);
}

export function getRoomsForMeetingType(type: "online" | "onsite" | "hybrid") {
  return MEETING_ROOMS.filter((room) =>
    type === "onsite" ? room.category === "onsite" : room.category === "online"
  );
}
