# App email inventory

Every active send path below enters the shared mailer. Names identify each email or email family in the existing controllers; repeated recipients in a family use the same path. The original subjects and HTML remain, with the old brand replaced at delivery by APP_NAME. SMS is unchanged.

Both raw SendGrid callers and old `config/sendgrid` imports now select the provider centrally. The order/admin paths already using Termii retain their public wrapper signatures. The old Termii transport and SendGrid factory remain selectable by EMAIL_PROVIDER; no app sender selects them directly.

| Source | Email/function | Previous path | Type tag |
| --- | --- | --- | --- |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: closeOrder | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: update-auction-status | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: create-auction-winner-order | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: process-pending-message-notifications | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: mark_unpaid_orders_stale | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: mark_terminal_orders_stale | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: credit_welcome_bonus | Termii compatibility → mailer | Template/auth type or transactional |
| [config/agenda.js](../server/src/config/agenda.js) | agenda: stream_reminder_push | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/WebhookController.js](../server/src/controllers/WebhookController.js) | handleTransferSuccess | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/WebhookController.js](../server/src/controllers/WebhookController.js) | handleTransferFailed | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.disableSeller | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.enableSeller | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.verifyBusinessAccount | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.adminCancelOrder | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.updateWithdrawalStatus | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.verifyBuyerIdentity | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.rejectBusinessAccount | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.manualCompleteWithdrawal | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | sendStatusUpdateEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.approveBankChangeRequest | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.rejectBankChangeRequest | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.processBankChangeRequest | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | sendBulkUploadEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.deleteBuyerAccount | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.updateSellerInfo | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.revokeSellerVerification | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | sendProductStatusEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | sendWalletTransactionEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.deleteAllSellerProducts | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.sendOnboardingReminderEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.sendBulkOnboardingReminders | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | sendBuyerWalletTransactionEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.sendRemindersToSellersWithoutProducts | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/adminController.js](../server/src/controllers/adminController.js) | exports.sendRemindersToSellersWithoutBlips | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.register | SendGrid → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.resendOTP | SendGrid → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.verifyIdentity | SendGrid → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.requestAccountDeletion | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.confirmAccountDeletion | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.reportUser | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/buyerController.js](../server/src/controllers/buyerController.js) | exports.sendWalletTopUpEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/campaignController.js](../server/src/controllers/campaignController.js) | sendCampaignEmails | SendGrid → mailer | campaign |
| [controllers/messageController.js](../server/src/controllers/messageController.js) | sendSellerMessageNotification | SendGrid → mailer | new-message |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.sendEmailNotification | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.sendEmailToBuyer | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.sendCampaignEmails | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.processBatchOrderNotifications | SendGrid → mailer | order-notification |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.sendNewFollowerEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/notificationController.js](../server/src/controllers/notificationController.js) | exports.sendBlipCommentEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.createOrder | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.arrangePickup | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.updateOrderOpenStatus | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.cancelShipment | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | sendSlackNotificationForPaidOrder | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | handleTransferSuccess | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | handleTransferFailed | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | sendSimpleTopUpEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.sendOrderConfirmationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.cancelOrderBySeller | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.processRefundRequest | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | handleFailedPayment | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.updateInternationalOrderTracking | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderController.js](../server/src/controllers/orderController.js) | exports.updateInternationalOrderStatus | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | sendSlackNotificationForPaidOrder | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | sendOrderConfirmationEmail | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | exports.createOrder | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | exports.cancelOrderBySeller | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | exports.cancelOrderByBuyer | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | sendSimpleTopUpEmail | SendGrid → mailer | order-update |
| [controllers/orderControllerv2.js](../server/src/controllers/orderControllerv2.js) | handleFailedPayment | SendGrid → mailer | order-update |
| [controllers/pickupController.js](../server/src/controllers/pickupController.js) | exports.createPickupRequest | SendGrid → mailer | pickup-update |
| [controllers/pickupController.js](../server/src/controllers/pickupController.js) | exports.processPickupRequest | SendGrid → mailer | pickup-update |
| [controllers/postController.js](../server/src/controllers/postController.js) | exports.reportPost | SendGrid → mailer | post-notification |
| [controllers/productController.js](../server/src/controllers/productController.js) | agenda: end-auction | SendGrid → mailer | auction-result |
| [controllers/returnController.js](../server/src/controllers/returnController.js) | exports.resolveDispute | SendGrid → mailer | return-update |
| [controllers/returnController.js](../server/src/controllers/returnController.js) | sendRefundConfirmationEmails | SendGrid → mailer | return-update |
| [controllers/returnController.js](../server/src/controllers/returnController.js) | sendShippingLabelEmails | SendGrid → mailer | return-update |
| [controllers/returnController.js](../server/src/controllers/returnController.js) | exports.rejectReturnRequest | SendGrid → mailer | return-update |
| [controllers/returnController.js](../server/src/controllers/returnController.js) | exports.adminUpdateStatus | SendGrid → mailer | return-update |
| [controllers/returnControllerv2.js](../server/src/controllers/returnControllerv2.js) | notifyAdmins | SendGrid → mailer | return-update |
| [controllers/returnControllerv2.js](../server/src/controllers/returnControllerv2.js) | sendRefundConfirmationEmails | SendGrid → mailer | return-update |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | exports.requestBankAccountChange | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | sendStoreVerificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | exports.createWithdrawalRequest | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | exports.toggleVacationMode | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | exports.toggleAccountPending | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/sellerController.js](../server/src/controllers/sellerController.js) | exports.markVerified | Termii compatibility → mailer | Template/auth type or transactional |
| [controllers/testEmailController.js](../server/src/controllers/testEmailController.js) | exports.testEmail | New admin test → mailer | test-email |
| [models/Order.js](../server/src/models/Order.js) | module | SendGrid → mailer | order-seller-notification |
| [modules/adminv2/controllers/admin.controller.js](../server/src/modules/adminv2/controllers/admin.controller.js) | disableNonLagosSellers | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/buyer/services/confirmAccountDeletion.service.js](../server/src/modules/buyer/services/confirmAccountDeletion.service.js) | sendConfirmationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/buyer/services/forgotPassword.service.js](../server/src/modules/buyer/services/forgotPassword.service.js) | sendResetEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/buyer/services/reportUser.service.js](../server/src/modules/buyer/services/reportUser.service.js) | sendReportNotificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/buyer/services/requestAccountDeletion.service.js](../server/src/modules/buyer/services/requestAccountDeletion.service.js) | sendDeletionEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/buyer/services/resendOTP.service.js](../server/src/modules/buyer/services/resendOTP.service.js) | sendOTPEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | exports.sendSlackNotificationForPaidOrder | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | exports.sendOrderConfirmationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | exports.sendSellerOrderNotificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | exports.sendShipmentFailureEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | exports.handleFailedPayment | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/helpers/order.helper.js](../server/src/modules/orderv2/helpers/order.helper.js) | sendSimpleTopUpEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/models/order.model.js](../server/src/modules/orderv2/models/order.model.js) | module | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/services/cancel-order-by-buyer.service.js](../server/src/modules/orderv2/services/cancel-order-by-buyer.service.js) | sendCancellationEmails | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/services/cancel-order-by-buyer.service.js](../server/src/modules/orderv2/services/cancel-order-by-buyer.service.js) | sendAdminRefundNotification | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/services/cancel-order.service.js](../server/src/modules/orderv2/services/cancel-order.service.js) | sendCancellationEmails | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/orderv2/services/cancel-order.service.js](../server/src/modules/orderv2/services/cancel-order.service.js) | sendAdminRefundNotification | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/register.service.js](../server/src/modules/seller/services/register.service.js) | sendWelcomeEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/register.service.js](../server/src/modules/seller/services/register.service.js) | sendAdminNotification | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/resendOTP.service.js](../server/src/modules/seller/services/resendOTP.service.js) | sendOTPEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/saveBusinessSmileIdVerification.service.js](../server/src/modules/seller/services/saveBusinessSmileIdVerification.service.js) | sendVerificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/saveIndividualSmileIdVerification.service.js](../server/src/modules/seller/services/saveIndividualSmileIdVerification.service.js) | sendVerificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [modules/seller/services/smileIdCallback.service.js](../server/src/modules/seller/services/smileIdCallback.service.js) | sendVerificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [services/auth/passwordReset.js](../server/src/services/auth/passwordReset.js) | issue | Termii compatibility → mailer | Template/auth type or transactional |
| [services/auth/passwordReset.js](../server/src/services/auth/passwordReset.js) | reset | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendPasswordResetEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendAdminLoginNotificationEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendInternationalSellerEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendShipmentFailureEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/emailService.js](../server/src/utils/emailService.js) | sendTransactionalEmail | Termii compatibility → mailer | Template/auth type or transactional |
| [utils/withdrawalSafety.js](../server/src/utils/withdrawalSafety.js) | sendNoBankDetailsEmails | Termii compatibility → mailer | Template/auth type or transactional |
| [webhooks/fezWebhook.js](../server/src/webhooks/fezWebhook.js) | sendStatusEmails | Termii compatibility → mailer | Template/auth type or transactional |
| [webhooks/terminalWebhook.js](../server/src/webhooks/terminalWebhook.js) | sendTerminalEventEmails | Termii compatibility → mailer | Template/auth type or transactional |

Auth templates include verification/sign-up/resend code, welcome, password reset and password changed. Direct migration also covers message reminders, campaign product emails, return/refund/replacement updates, auction results, post notifications, pickups, paid/cancelled/failed orders, wallet top-ups, and seller payment release. The compatibility paths additionally include admin security/account/payout notifications, delivery/webhook updates, reports, account deletion, business/Smile ID verification, invitations, recording access and API monitoring alerts.

Legacy recovery implementations kept inactive by #49 remain inactive. Raw Termii template variables continue through the compatibility wrappers; the selected legacy Termii fallback still uses its configured template/sender account. SMTP/bounce/complaint webhooks have not been added.
