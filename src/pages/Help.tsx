import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Settings, 
  AlertCircle, 
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from "lucide-react";

const Help = () => {
  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-0">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Help Center</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Your guide to using the Dutton Lab Equipment Scheduler
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Jump to the section you need help with</CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="getting-started" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold">Getting Started</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <p>
                Welcome to the Dutton Lab Equipment Scheduler! This system helps you book lab equipment, 
                track your usage, and coordinate with other lab members.
              </p>
              <div className="space-y-2">
                <p className="font-medium text-foreground">What you can do:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>View available equipment and their status in real-time</li>
                  <li>Schedule equipment bookings in advance</li>
                  <li>Log walk-in usage sessions with Quick Add</li>
                  <li>View your booking history and usage statistics</li>
                  <li>Manage your profile and spirit animal</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="booking-equipment" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">Booking Equipment</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <p className="font-medium text-foreground">How to make a booking:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Navigate to the <strong>Schedule</strong> page from the navigation menu</li>
                <li>Click on an available time slot in the calendar</li>
                <li>Select the equipment you need from the dropdown</li>
                <li>Choose your project (if applicable)</li>
                <li>Enter the purpose of your booking</li>
                <li>For HiPerGator bookings, specify CPU/GPU requirements</li>
                <li>Click "Create Booking" to confirm</li>
              </ol>
              <div className="bg-muted p-3 rounded-lg mt-3">
                <p className="text-sm"><strong>Tip:</strong> You can also click "View all" on the Dashboard's Upcoming Bookings section to access the Schedule page.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="quick-add" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="font-semibold">Quick Add Usage</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <p>
                Quick Add allows you to log equipment usage for walk-in sessions or immediate use 
                without prior booking.
              </p>
              <p className="font-medium text-foreground">When to use Quick Add:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>You're using equipment right now without a booking</li>
                <li>You forgot to book equipment in advance</li>
                <li>You need to log a short, unplanned session</li>
              </ul>
              <p className="font-medium text-foreground mt-3">How to use it:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Go to the <strong>Quick Add</strong> page</li>
                <li>Select the equipment you're using</li>
                <li>Enter start and end times</li>
                <li>Choose your project and add notes if needed</li>
                <li>For quantification equipment, log samples processed</li>
                <li>Click "Log Usage" to record your session</li>
              </ol>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="managing-bookings" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Edit className="w-5 h-5 text-primary" />
                <span className="font-semibold">Managing Your Bookings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <p className="font-medium text-foreground">Viewing your bookings:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Dashboard:</strong> See your upcoming bookings on the home page</li>
                <li><strong>Schedule:</strong> View all bookings in calendar format</li>
                <li><strong>History:</strong> Review past bookings and usage records</li>
              </ul>
              
              <div className="space-y-2 mt-4">
                <p className="font-medium text-foreground">Actions you can take:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Trash2 className="w-4 h-4 text-destructive mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Delete a booking:</p>
                      <p className="text-sm">Click the trash icon on any booking card. Note: Only cancel if you truly don't need the time slot.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg mt-3 border border-amber-200 dark:border-amber-900">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Important:</strong> Please cancel bookings you can't attend so others can use the equipment.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="equipment-guide" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-primary" />
                <span className="font-semibold">Equipment Guide</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <p className="font-medium text-foreground">Available equipment types:</p>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-3">
                  <p className="font-medium text-foreground">Robots</p>
                  <p className="text-sm">Automated laboratory robots for sample processing and experiments</p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <p className="font-medium text-foreground">Quantification Equipment</p>
                  <p className="text-sm">Equipment for measuring and quantifying samples (1-100 samples per session)</p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <p className="font-medium text-foreground">PCR Machines</p>
                  <p className="text-sm">Polymerase Chain Reaction equipment for DNA amplification</p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <p className="font-medium text-foreground">Sequencers</p>
                  <p className="text-sm">DNA/RNA sequencing machines</p>
                </div>
                <div className="border-l-4 border-primary pl-3">
                  <p className="font-medium text-foreground">HiPerGator</p>
                  <p className="text-sm">High-performance computing resources (requires CPU/GPU allocation)</p>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-lg mt-3">
                <p className="text-sm">
                  <strong>Equipment Status:</strong> Green = Available, Orange = In Use, Red = Maintenance
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="rules-policies" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold">Rules & Policies</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-foreground">Booking Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>Book only the time you actually need</li>
                    <li>Cancel bookings you can't attend at least 2 hours in advance</li>
                    <li>Be on time for your booked sessions</li>
                    <li>Clean and reset equipment after use</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">Time Limits:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>Maximum booking duration varies by equipment type</li>
                    <li>HiPerGator sessions: coordinate with lab management</li>
                    <li>Walk-in usage allowed when equipment shows "Available"</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">Priority System:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>First-come, first-served for general bookings</li>
                    <li>PI and lab managers may override for urgent needs</li>
                    <li>Repeated no-shows may affect booking privileges</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="troubleshooting" className="border rounded-lg px-4 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold">Troubleshooting</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-3 pt-2">
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-foreground">Can't see equipment or bookings?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-sm">
                    <li>Refresh your browser page</li>
                    <li>Check if you're logged in with the correct account</li>
                    <li>Verify your internet connection</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">Booking slot not available?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-sm">
                    <li>The slot may have just been booked by someone else</li>
                    <li>Try a different time slot nearby</li>
                    <li>Check if equipment is under maintenance</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">Can't delete your booking?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-sm">
                    <li>Make sure you're the booking owner</li>
                    <li>Check if the booking has already started or ended</li>
                    <li>Contact lab management for help</li>
                  </ul>
                </div>

                <div>
                  <p className="font-medium text-foreground">Equipment showing wrong status?</p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-sm">
                    <li>Report to lab management immediately</li>
                    <li>Do not use equipment marked as "Maintenance"</li>
                  </ul>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <div>
                <CardTitle>Need More Help?</CardTitle>
                <CardDescription>Contact our lab support team</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              If you can't find the answer to your question, please reach out to lab management:
            </p>
            <div className="space-y-2 text-sm">
              <p><strong>Lab Email:</strong> duttonlab@ufl.edu</p>
              <p><strong>Office Hours:</strong> Monday-Friday, 9 AM - 5 PM</p>
              <p><strong>Emergency Contact:</strong> Available in lab notification emails</p>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default Help;
