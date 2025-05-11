package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;


import lombok.Data;

/**
 * 投保人
 */
@Data
public class ApplicantMG extends ParticipantBaseMG {
    private static final long serialVersionUID = 4135565423997499855L;

    /**
     * 非自然人特殊客户类型
     */
    private String organizationTypeCd;

    /**
     * 上级机构
     */
    private String hasParentOrgName;
}
