export function handleError(error) {
  console.error("API Error:", error);
  if (error.response) {
    return { message: "An error occurred while processing your request." };
  } else if (error.request) {
    return {
      success: false,
      message: "Unable to connect to the server. Please try again later.",
    };
  } else {
    return { message: "An unexpected error occurred." };
  }
}
