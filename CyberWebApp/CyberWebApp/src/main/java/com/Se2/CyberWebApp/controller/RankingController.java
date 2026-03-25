package com.Se2.CyberWebApp.controller;

import com.Se2.CyberWebApp.dto.RankingDTO;
import com.Se2.CyberWebApp.entity.User;
import com.Se2.CyberWebApp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*") // QUAN TRỌNG: Cho phép Frontend (HTML) gọi API không bị lỗi CORS
public class RankingController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/ranking")
    public List<RankingDTO> getRanking() {
        List<User> topUsers = userRepository.findTop10ByOrderByPointDesc();

        // Chuyển từ User Entity sang RankingDTO
        return topUsers.stream().map(user -> new RankingDTO(
                user.getName(),
                user.getRoleEntity() != null ? user.getRoleEntity().getName() : "MEMBER",
                user.getPoint(),
                user.getAvatar()
        )).collect(Collectors.toList());
    }
}