export type Notification = {
  id: string;
  createdAt: string;
  notification: string;
  read: boolean;
  updatedAt: string;
};

export type GetNotificationsResponse = {
  statusCode: number;
  message: string;
  data: Notification[];
};

export type ToggleNotificationsRequest = {
  notificationEnabled: boolean;
};

export type ToggleNotificationsResponse = {
  statusCode: number;
  message: string;
  data: {};
};
