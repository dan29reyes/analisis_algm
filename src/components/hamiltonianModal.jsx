import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MyDialog = ({ isOpen, onClose, title, children }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1440px] w-[95vw] h-[90vh] flex flex-col p-6 rounded-lg shadow-2xl bg-white text-gray-900">
        <DialogHeader className="flex justify-between pb-4 border-b border-gray-200">
          {title && (
            <DialogTitle className="text-gray-900 text-2xl font-bold pr-4">
              <img
                className="inline-block w-8 h-8 mr-2"
                src="https://upload.wikimedia.org/wikipedia/commons/7/75/Emblem_of_the_First_Galactic_Empire.svg"
                alt=""
              />
              {title}
            </DialogTitle>
          )}
        </DialogHeader>
        <div className="flex-grow w-full h-full overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
};

export default MyDialog;
