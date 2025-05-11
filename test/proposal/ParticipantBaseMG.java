package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

/**
 * 参与者信息
 */
@Data
public class ParticipantBaseMG implements Serializable {

    private static final long serialVersionUID = -4414204191683499781L;

    /**
     * 客户域uid
     */
    private String uid;

    /**
     * 参与者姓名
     */
    private String participantName;

    /**
     * 客户分类 1: 个人, 2: 企业, 3: 非企业组织
     */
    private String clientClassifyCd;

    /**
     * 证件类型
     */
    private String certTypeCd;

    /**
     * 证件号码
     */
    private String certNo;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateDeserializer.class
    )
    /**
     * 证件有效起期
     */
    private LocalDate certEffectiveStartDt;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateDeserializer.class
    )
    /**
     * 证件有效止期
     */
    private LocalDate certEffectiveEndDt;

    /**
     * 联系电话
     */
    private String contactTelephone;

    @JsonFormat(
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "GMT+8"
    )
    @JsonSerialize(
            using = LocalDateSerializer.class
    )
    @JsonDeserialize(
            using = LocalDateDeserializer.class
    )
    /**
     * 出生日期
     */
    private LocalDate birthDate;

    /**
     * 电话
     */
    private String mobilePhone;
}
