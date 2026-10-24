package com.baizu.tiedye.tutor.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.baizu.tiedye.tutor.entity.UserQuizStat;

public interface UserQuizStatRepository extends JpaRepository<UserQuizStat, Long> {

    Optional<UserQuizStat> findByActorKeyAndTopic(String actorKey, String topic);

    List<UserQuizStat> findByActorKeyOrderByUpdatedAtDesc(String actorKey);
}
