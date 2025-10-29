import { Logger } from "./logger";

export const InteractionLogger = {
  click: (elementName: string, details?: Record<string, any>) => {
    Logger.debug(`User clicked on: ${elementName}`, details);
  },

  formSubmit: (formName: string, data: Record<string, any>) => {
    Logger.debug(`User submitted form: ${formName}`, data);
  },

  // Add more interaction logging methods as needed
  pageView: (pageName: string, details?: Record<string, any>) => {
    Logger.debug(`User viewed page: ${pageName}`, details);
  },

  customEvent: (eventName: string, details?: Record<string, any>) => {
    Logger.debug(`Custom interaction event: ${eventName}`, details);
  },
};