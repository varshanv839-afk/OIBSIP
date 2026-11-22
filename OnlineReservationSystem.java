
import java.util.Scanner;

public class OnlineReservationSystem {

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.println("================================");
        System.out.println("   ONLINE RESERVATION SYSTEM");
        System.out.println("================================");

        System.out.print("Enter username: ");
        String username = sc.nextLine();

        System.out.print("Enter password: ");
        String password = sc.nextLine();

        if (username.equals("admin") && password.equals("1234")) {
            System.out.println("\nLogin Successful!");
            System.out.println("Welcome, " + username);

            System.out.println("\n--- Reservation Menu ---");
            System.out.println("1. Reserve Ticket");
            System.out.println("2. Cancel Ticket");
            System.out.println("3. Exit");

            System.out.print("Enter your choice: ");
            int choice = sc.nextInt();

            switch (choice) {
                case 1:
                    sc.nextLine();
                    System.out.print("Enter passenger name: ");
                    String name = sc.nextLine();

                    System.out.print("Enter train name: ");
                    String train = sc.nextLine();

                    System.out.print("Enter journey date: ");
                    String date = sc.nextLine();

                    System.out.print("Enter starting place: ");
                    String from = sc.nextLine();

                    System.out.print("Enter destination: ");
                    String to = sc.nextLine();

                    System.out.println("\nReservation Successful!");
                    System.out.println("Passenger: " + name);
                    System.out.println("Train: " + train);
                    System.out.println("Date: " + date);
                    System.out.println("From: " + from);
                    System.out.println("To: " + to);
                    System.out.println("Ticket ID: " + (int)(Math.random() * 9000 + 1000));
                    break;

                case 2:
                    System.out.print("Enter Ticket ID to cancel: ");
                    int ticketId = sc.nextInt();
                    System.out.println("Ticket " + ticketId + " cancelled successfully.");
                    break;

                case 3:
                    System.out.println("Thank you for using the system!");
                    break;

                default:
                    System.out.println("Invalid choice!");
            }

        } else {
            System.out.println("Invalid username or password!");
        }

        sc.close();
    }
}
