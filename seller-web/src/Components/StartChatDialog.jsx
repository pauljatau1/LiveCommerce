import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/Components/ui/command";
import { Button } from "@/Components/ui/button";
import { useState } from "react";

const StartChatDialog = ({ isOpen, onClose, onStartChat, customers }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Command>
            <CommandInput placeholder="Search customers..." />
            <CommandEmpty>No customers found.</CommandEmpty>
            <CommandGroup>
              {customers.map((customer) => (
                <CommandItem
                  key={customer._id}
                  onSelect={() => setSelectedCustomer(customer)}
                >
                  {customer.firstName} {customer.lastName}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => {
              onStartChat(selectedCustomer);
              setSelectedCustomer(null);
            }}
            disabled={!selectedCustomer}
          >
            Start Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StartChatDialog; 