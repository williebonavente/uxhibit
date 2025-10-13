import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogContent = DialogPrimitive.Content;
export const DialogHeader = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const DialogTitle = DialogPrimitive.Title;
export const DialogFooter = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;