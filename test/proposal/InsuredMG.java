package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

/**
 * 被保人
 */
@Data
public class InsuredMG extends ParticipantBaseMG {
    private static final long serialVersionUID = -997638363856081683L;

    /**
     * 是否主被保险人
     */
    //@NotNull(message = "是否主被保险人不能为空!")
    private Integer isMajorInsured;

    /**
     * 学校
     */
    private String school;

    /**
     * 年级
     */
    private String grade;

    /**
     * 班级
     */
    private String clazz;

}
