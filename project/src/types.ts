export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
  status?: 'seen';
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  avatar: string;
  unread: number;
  timestamp: Date;
}

export interface ChatApiRequest {
  user_input: string;
  user_id: string;
}

export interface ChatApiResponse {
  response: string;
}