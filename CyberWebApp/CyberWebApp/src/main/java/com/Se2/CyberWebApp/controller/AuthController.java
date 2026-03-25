package com.Se2.CyberWebApp.controller;

import com.Se2.CyberWebApp.dto.LoginDTO;
import com.Se2.CyberWebApp.dto.RankingDTO;
import com.Se2.CyberWebApp.entity.User;
import com.Se2.CyberWebApp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginRequest) {
        // 1. Tìm user theo username
        Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            // 2. KIỂM TRA MẬT KHẨU (SỬA Ở ĐÂY)
            // Nếu mật khẩu gửi lên từ web TRỐNG hoặc KHÔNG KHỚP với DB thì báo lỗi ngay
            if (loginRequest.getPassword() == null ||
                    loginRequest.getPassword().isEmpty() ||
                    !user.getPasswordHash().equals(loginRequest.getPassword())) {

                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai mật khẩu hoặc mật khẩu trống!");
            }

            // 3. Nếu mọi thứ đúng, trả về thông tin đăng nhập thành công
            RankingDTO userInfo = new RankingDTO(
                    user.getName(),
                    user.getRoleEntity() != null ? user.getRoleEntity().getName() : "MEMBER",
                    user.getPoint(),
                    user.getAvatar()
            );
            return ResponseEntity.ok(userInfo);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Tài khoản không tồn tại!");
        }
    }
}