export const isCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
