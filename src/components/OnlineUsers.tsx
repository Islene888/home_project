import { Box, Flex, Text } from "@radix-ui/themes";

import type { CollaborativeService } from "../firebase/collaborative";

interface OnlineUsersProps {
  users: any[];
  collaborative: CollaborativeService;
}

export const OnlineUsers = ({ users, collaborative }: OnlineUsersProps) => {
  const currentUser = collaborative.getUserInfo();

  return (
    <Box
      style={{
        position: "fixed",
        top: "12px",
        left: "80px",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: "6px",
        padding: "6px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
        zIndex: 1000,
        minWidth: "90px",
      }}
    >
      <Flex align="center" gap="1" wrap="wrap">
        {/* 当前用户 */}
        <Box
          style={{
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            backgroundColor: currentUser.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 0 2px white, 0 0 0 3px ${currentUser.color}`,
          }}
          title={`${currentUser.name} (你)`}
        >
          <Text
            size="1"
            weight="bold"
            style={{ color: "white", fontSize: "7px" }}
          >
            {currentUser.name.slice(-1)}
          </Text>
        </Box>

        {/* 其他用户 */}
        {users.slice(0, 4).map((user) => (
          <Box
            key={user.id}
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: user.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 1px white`,
            }}
            title={user.name}
          >
            <Text
              size="1"
              weight="bold"
              style={{ color: "white", fontSize: "7px" }}
            >
              {user.name.slice(-1)}
            </Text>
          </Box>
        ))}

        {users.length > 4 && (
          <Text
            size="1"
            style={{ color: "#6b7280", fontSize: "8px", marginLeft: "2px" }}
          >
            +{users.length - 4}
          </Text>
        )}
      </Flex>
    </Box>
  );
};
