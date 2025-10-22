response if clockout

{
	"ipAddress":	"192.168.1.11",
	"portNo":	4000,
	"protocol":	"HTTP",
	"macAddress":	"a4:d5:c2:24:dd:74",
	"channelID":	1,
	"dateTime":	"2025-10-22T13:55:52+08:00",
	"activePostCount":	1,
	"eventType":	"AccessControllerEvent",
	"eventState":	"active",
	"eventDescription":	"Access Controller Event",
	"AccessControllerEvent":	{
		"deviceName":	"Access Controller",
		"majorEventType":	5,
		"subEventType":	22,
		"cardReaderKind":	1,
		"doorNo":	1,
		"serialNo":	159,
		"currentVerifyMode":	"invalid",
		"frontSerialNo":	158,
		"attendanceStatus":	"undefined",
		"label":	"",
		"statusValue":	0,
		"mask":	"unknown",
		"purePwdVerifyEnable":	true
	}
}

response if clockin

{
	"ipAddress":	"192.168.1.11",
	"portNo":	4000,
	"protocol":	"HTTP",
	"macAddress":	"a4:d5:c2:24:dd:74",
	"channelID":	1,
	"dateTime":	"2025-10-22T13:43:48+08:00",
	"activePostCount":	1,
	"eventType":	"AccessControllerEvent",
	"eventState":	"active",
	"eventDescription":	"Access Controller Event",
	"AccessControllerEvent":	{
		"deviceName":	"Access Controller",
		"majorEventType":	5,
		"subEventType":	38,
		"cardNo":	"11",
		"cardType":	1,
		"name":	"hex",
		"cardReaderKind":	1,
		"cardReaderNo":	1,
		"verifyNo":	165,
		"employeeNoString":	"001",
		"serialNo":	139,
		"userType":	"normal",
		"currentVerifyMode":	"cardOrFaceOrFp",
		"frontSerialNo":	138,
		"attendanceStatus":	"checkIn",
		"label":	"Check In",
		"statusValue":	0,
		"mask":	"unknown",
		"purePwdVerifyEnable":	true
	}
}
