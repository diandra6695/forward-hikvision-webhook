export interface AccessControllerEvent {
  deviceName: string;
  majorEventType: number;
  subEventType: number;
  cardNo?: string;
  cardType?: number;
  name?: string;
  cardReaderKind: number;
  cardReaderNo?: number;
  doorNo: number;
  serialNo: number;
  verifyNo?: number;
  employeeNoString?: string;
  userType?: string;
  currentVerifyMode: string;
  frontSerialNo: number;
  attendanceStatus: AttendanceStatus;
  label: string;
  statusValue: number;
  mask: string;
  purePwdVerifyEnable: boolean;
}

export enum AttendanceStatus {
  CHECK_IN = 'checkIn',
  CHECK_OUT = 'checkOut',
  UNDEFINED = 'undefined',
}

export enum SubEventType {
  CLOCK_IN = 38,
  CLOCK_OUT = 22,
}

export interface HikvisionWebhookPayload {
  ipAddress: string;
  portNo: number;
  protocol: 'HTTP' | 'HTTPS';
  macAddress: string;
  channelID: number;
  dateTime: string; // ISO 8601 format
  activePostCount: number;
  eventType: 'AccessControllerEvent';
  eventState: 'active' | 'inactive';
  eventDescription: string;
  eventDetail: AccessControllerEvent;
  AccessControllerEvent: AccessControllerEvent;
}

export interface ProcessedAttendanceData {
  deviceId: string;
  deviceName: string;
  employeeNo: string;
  employeeNoString: string;
  employeeName: string;
  attendanceStatus: AttendanceStatus;
  timestamp: Date;
  eventType: SubEventType;
  doorNo: number;
  verifyMethod: string;
  ipAddress: string;
  rawPayload: HikvisionWebhookPayload;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  data?: ProcessedAttendanceData;
  error?: string;
}
