import React, { useEffect, useState } from 'react'
import SockJS from 'sockjs-client';
import { addNotification } from '../Redux/Notifications/action';
import { useDispatch, useSelector } from 'react-redux';
import Stomp from "stompjs";
import { NOTIFICATIONS_WS_URL } from '../config/api';

const useNotificationWebsoket = (userId,type) => {
    
 
    const dispatch=useDispatch()

    const [stompClient, setStompClient] = useState(null);
    useEffect(() => {
        if (!userId) return; // Only connect if userId is available
    
        const sock = new SockJS(NOTIFICATIONS_WS_URL);
        const stomp = Stomp.over(sock);
        setStompClient(stomp);
      }, [userId]);
    
      useEffect(() => {
        if (stompClient) {
          stompClient.connect(
            {},
            () => {
              
              stompClient.subscribe(
                `/notification/${type}/${userId}`,
                onMessageRecive,
                (error) => {
                  console.error("Subscription error:", error);
                }
              );
              console.log("Subscribed to notifications for user ID:", userId);
            },
            (error) => {
              console.error("WebSocket error:", error);
            }
          );
        }
    
        return () => {
          if (stompClient?.connected) {
            stompClient.disconnect(() => {
              console.log("Disconnected from WebSocket");
            });
          }
        };
      }, [stompClient, userId]);
    
      const onMessageRecive = (payload) => {
        console.log("New message received", payload);
        const receivedMessage = JSON.parse(payload.body);
    
        // Dispatch the new notification to Redux store
        dispatch(addNotification(receivedMessage));
      };
}

export default useNotificationWebsoket