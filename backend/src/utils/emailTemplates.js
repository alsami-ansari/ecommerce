// Template for when a new user registers
export const welcomeEmailTemplate = (name) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h1 style="color: #4CAF50;">Welcome to our Store, ${name}!</h1>
      <p>We are absolutely thrilled to have you here.</p>
      <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <p style="margin: 0; font-size: 16px;">Use the code <strong>WELCOME10</strong> to get a 10% discount on your first order!</p>
      </div>
      <p>If you have any questions, feel free to reply to this email.</p>
      <br />
      <p>Thanks,<br />The Ecommerce Team</p>
    </div>
  `;
};

// You can add more templates here later, like an Order Receipt!
export const receiptEmailTemplate = (orderId, total) => {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Thank you for your purchase!</h2>
      <p>Your Order ID is: <strong>${orderId}</strong></p>
      <p>Total Paid: $${total}</p>
    </div>
  `;
};
