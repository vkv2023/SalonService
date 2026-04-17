package com.salon.controller;

import com.razorpay.RazorpayException;
import com.salon.domain.PaymentMethod;
import com.salon.dto.BookingDTO;
import com.salon.dto.UserDTO;
import com.salon.model.PaymentOrder;
import com.salon.payloadReponse.PaymentLinkResponse;
import com.salon.service.PaymentService;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentLink;
import lombok.RequiredArgsConstructor;
import org.json.JSONException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payments")
public class PaymentOrderController {

    private final PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<PaymentLinkResponse> createPaymentLink(
            @RequestBody BookingDTO bookingDTO,
            @RequestParam PaymentMethod paymentMethod
            ) throws StripeException, RazorpayException, JSONException {
        UserDTO userDTO = new UserDTO();
        userDTO.setFName("Test");
        userDTO.setLName("Kumar");
        userDTO.setEmail("test@gmail.com");
        userDTO.setId(1L);

        PaymentLinkResponse paymentLinkResponse = paymentService.createOrder(
                userDTO,bookingDTO,paymentMethod
        );
        return new ResponseEntity<>(paymentLinkResponse, HttpStatus.OK);
    }

    @GetMapping("/{paymentOrderId}")
    public ResponseEntity<PaymentOrder> getPaymentOrderById(
            @PathVariable Long payOrderId) throws Exception {
        UserDTO userDTO = new UserDTO();
        userDTO.setFName("Test");
        userDTO.setLName("Kumar");
        userDTO.setEmail("test@gmail.com");
        userDTO.setId(1L);

        PaymentOrder paymentOrderByID = paymentService.getPaymentOrderByID(payOrderId);
        return new ResponseEntity<>(paymentOrderByID, HttpStatus.OK);
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentOrder> getPaymentById(
            @PathVariable String paymentId) throws Exception {
        UserDTO userDTO = new UserDTO();
        userDTO.setFName("Test");
        userDTO.setLName("Kumar");
        userDTO.setEmail("test@gmail.com");
        userDTO.setId(1L);

        PaymentOrder paymentByID = paymentService.getPaymentOrderByPaymentId(paymentId);
        return new ResponseEntity<>(paymentByID, HttpStatus.OK);
    }

    @PatchMapping("/proceed")
    public ResponseEntity<Boolean> proceedPayment(
            @RequestParam String paymentId,
            @RequestParam String paymentLinkId
    ) throws Exception {

        PaymentOrder paymentOrder = paymentService.getPaymentOrderByPaymentId(paymentId);

          Boolean response = paymentService.proceedPayment(paymentOrder, paymentId, paymentLinkId);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
